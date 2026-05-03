import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Wallet, TrendingUp, ClipboardList } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, collected: 0, unpaid: 0, present: 0 })
  const [chartData, setChartData] = useState([
    { term: 'Term 1', paid: 0, unpaid: 0 },
    { term: 'Term 2', paid: 0, unpaid: 0 },
    { term: 'Term 3', paid: 0, unpaid: 0 },
  ])
  const [pieData, setPieData] = useState([
    { name: 'Present', value: 0, color: '#22c55e' },
    { name: 'Absent', value: 0, color: '#ef4444' },
    { name: 'Late', value: 0, color: '#eab308' },
  ])

  useEffect(() => {
    const load = async () => {
      const { data: profile } = await supabase.from('profiles').select('school_id').single()
      const schoolId = profile?.school_id
      const today = new Date().toISOString().split('T')[0]

      const [{ count: students }, { data: fees }, { count: present }, { data: feeData }, { data: attData }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('fees').select('amount_paid, amount_due').eq('school_id', schoolId),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('date', today).eq('status', 'present'),
        supabase.from('fees').select('term, amount_paid, amount_due').eq('school_id', schoolId),
        supabase.from('attendance').select('status').eq('school_id', schoolId).eq('date', today)
      ])

      const collected = fees?.reduce((s, f) => s + f.amount_paid, 0) || 0
      const due = fees?.reduce((s, f) => s + f.amount_due, 0) || 0
      setStats({ students: students || 0, collected, unpaid: due - collected, present: present || 0 })

      // Chart data
      const termData = { 'Term 1': { paid: 0, unpaid: 0 }, 'Term 2': { paid: 0, unpaid: 0 }, 'Term 3': { paid: 0, unpaid: 0 } }
      feeData?.forEach(f => {
        termData[f.term].paid += f.amount_paid
        termData[f.term].unpaid += f.amount_due - f.amount_paid
      })
      setChartData([
        { term: 'Term 1', paid: termData['Term 1'].paid, unpaid: termData['Term 1'].unpaid },
        { term: 'Term 2', paid: termData['Term 2'].paid, unpaid: termData['Term 2'].unpaid },
        { term: 'Term 3', paid: termData['Term 3'].paid, unpaid: termData['Term 3'].unpaid },
      ])

      // Pie data
      const statusCount = { present: 0, absent: 0, late: 0 }
      attData?.forEach(a => statusCount[a.status]++)
      setPieData([
        { name: 'Present', value: statusCount.present, color: '#22c55e' },
        { name: 'Absent', value: statusCount.absent, color: '#ef4444' },
        { name: 'Late', value: statusCount.late, color: '#eab308' },
      ])
    }
    load()
  }, [])

  const cards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'blue' },
    { label: 'Fees Collected', value: `UGX ${stats.collected.toLocaleString()}`, icon: TrendingUp, color: 'green' },
    { label: 'Fees Unpaid', value: `UGX ${stats.unpaid.toLocaleString()}`, icon: Wallet, color: 'red' },
    { label: 'Present Today', value: stats.present, icon: ClipboardList, color: 'purple' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Here's what's happening at your school today.</p>
        </div>
        <div style={{fontSize:13, color:'#94a3b8'}}>
          {new Date().toLocaleDateString('en-UG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className={`stat-icon ${color}`}><Icon size={22} /></div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          
          {/* Fee Collection Chart */}
          <div className="table-card">
            <div className="table-card-header">
              <div><h3>Fee Collection</h3><p>Paid vs Unpaid this year</p></div>
            </div>
            <div style={{padding:'24px'}}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="term" tick={{fontSize:12, fill:'#94a3b8'}} />
                  <YAxis tick={{fontSize:12, fill:'#94a3b8'}} />
                  <Tooltip formatter={(val) => `UGX ${val.toLocaleString()}`} />
                  <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="unpaid" name="Unpaid" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="table-card">
            <div className="table-card-header">
              <div><h3>Today's Attendance</h3><p>Present vs Absent</p></div>
            </div>
            <div style={{padding:'24px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}