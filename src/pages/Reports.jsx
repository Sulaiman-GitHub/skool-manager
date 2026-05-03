import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Printer } from 'lucide-react'

export default function Reports() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('Term 1')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [schoolName, setSchoolName] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: profile } = await supabase.from('profiles').select('school_id, schools(name)').single()
      setSchoolName(profile?.schools?.name || 'School')
      const { data: s } = await supabase.from('students').select('*, classes(name)').order('full_name')
      setStudents(s || [])
      const { data: c } = await supabase.from('classes').select('*').order('name')
      setClasses(c || [])
    }
    load()
  }, [])

  const generate = async () => {
    setLoading(true)
    let query = supabase.from('students').select('*, classes(name)')
    if (selectedClass) query = query.eq('class_id', selectedClass)
    const { data: studentList } = await query.order('full_name')

    const { data: fees } = await supabase.from('fees')
      .select('*')
      .eq('term', selectedTerm)
      .eq('year', selectedYear)

    const { data: attendance } = await supabase.from('attendance')
      .select('*')
      .gte('date', `${selectedYear}-01-01`)
      .lte('date', `${selectedYear}-12-31`)

    const report = studentList?.map(s => {
      const studentFees = fees?.find(f => f.student_id === s.id)
      const studentAtt = attendance?.filter(a => a.student_id === s.id) || []
      const present = studentAtt.filter(a => a.status === 'present').length
      const total = studentAtt.length
      const attPercent = total > 0 ? Math.round((present / total) * 100) : 0
      return {
        ...s,
        fees_due: studentFees?.amount_due || 0,
        fees_paid: studentFees?.amount_paid || 0,
        fees_status: studentFees?.status || 'unpaid',
        attendance_percent: attPercent,
        days_present: present,
        total_days: total,
      }
    }) || []

    setReportData(report)
    setLoading(false)
  }

  const print = () => window.print()

  const statusColor = s => ({ paid: '#16a34a', partial: '#ca8a04', unpaid: '#dc2626' }[s] || '#dc2626')
  const statusBg = s => ({ paid: '#f0fdf4', partial: '#fefce8', unpaid: '#fef2f2' }[s] || '#fef2f2')

  return (
    <>
      <div className="page-header no-print">
        <div>
          <h2>Report Cards</h2>
          <p>Generate and print student reports by term</p>
        </div>
        {reportData.length > 0 && (
          <button className="btn btn-blue" onClick={print}>
            <Printer size={16} /> Print Reports
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="table-card no-print" style={{marginBottom:24}}>
          <div className="table-card-header">
            <div><h3>Generate Report</h3><p>Select filters and click generate</p></div>
          </div>
          <div style={{padding:'24px', display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end'}}>
            <div className="form-group" style={{margin:0, flex:1, minWidth:160}}>
              <label>Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
              </select>
            </div>
            <div className="form-group" style={{margin:0, flex:1, minWidth:160}}>
              <label>Term</label>
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
            </div>
            <div className="form-group" style={{margin:0, flex:1, minWidth:160}}>
              <label>Year</label>
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button className="btn btn-blue" onClick={generate} disabled={loading} style={{marginBottom:0}}>
              {loading ? 'Generating...' : 'Generate Reports'}
            </button>
          </div>
        </div>

        {reportData.length > 0 && (
          <div id="print-area">
            <style>{`
              @media print {
                .no-print { display: none !important; }
                .sidebar { display: none !important; }
                .main-content { margin-left: 0 !important; padding: 0 !important; }
                .page-header { display: none !important; }
                .page-body { padding: 0 !important; }
                .report-card { 
                  page-break-after: always; 
                  border: 2px solid #e2e8f0 !important;
                  padding: 24px !important;
                  margin: 0 !important;
                  max-width: 100% !important;
                  box-sizing: border-box !important;
                }
                .report-card > div { 
                  display: grid !important;
                  grid-template-columns: 1fr 1fr !important;
                  gap: 12px !important;
                }
                body { 
                  background: white !important; 
                  margin: 0 !important;
                }
                * { box-sizing: border-box !important; }
              }
            `}</style>

            {reportData.map(s => (
              <div key={s.id} className="report-card" style={{
                background:'white', border:'2px solid #e2e8f0', borderRadius:16,
                padding:32, marginBottom:24, maxWidth:700
              }}>
                <div style={{textAlign:'center', borderBottom:'2px solid #1e40af', paddingBottom:16, marginBottom:24}}>
                  <div style={{fontSize:28}}>🏫</div>
                  <h2 style={{fontSize:22, fontWeight:800, color:'#1e293b', margin:'8px 0 4px'}}>{schoolName}</h2>
                  <p style={{color:'#64748b', fontSize:14, margin:0}}>Student Progress Report — {selectedTerm} {selectedYear}</p>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24}}>
                  <div>
                    <p style={{fontSize:12, color:'#94a3b8', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Student Name</p>
                    <p style={{fontSize:16, fontWeight:700, color:'#1e293b', margin:0}}>{s.full_name}</p>
                  </div>
                  <div>
                    <p style={{fontSize:12, color:'#94a3b8', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Class</p>
                    <p style={{fontSize:16, fontWeight:700, color:'#1e293b', margin:0}}>{s.classes?.name || '—'}</p>
                  </div>
                  <div>
                    <p style={{fontSize:12, color:'#94a3b8', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Gender</p>
                    <p style={{fontSize:16, fontWeight:600, color:'#475569', margin:0, textTransform:'capitalize'}}>{s.gender}</p>
                  </div>
                  <div>
                    <p style={{fontSize:12, color:'#94a3b8', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Term</p>
                    <p style={{fontSize:16, fontWeight:600, color:'#475569', margin:0}}>{selectedTerm} {selectedYear}</p>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24}}>
                  <div style={{background:'#f8fafc', borderRadius:12, padding:16}}>
                    <p style={{fontSize:13, fontWeight:600, color:'#475569', margin:'0 0 12px'}}>💰 Fee Summary</p>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                      <span style={{fontSize:13, color:'#94a3b8'}}>Amount Due</span>
                      <span style={{fontSize:13, fontWeight:600}}>UGX {s.fees_due.toLocaleString()}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                      <span style={{fontSize:13, color:'#94a3b8'}}>Amount Paid</span>
                      <span style={{fontSize:13, fontWeight:600, color:'#16a34a'}}>UGX {s.fees_paid.toLocaleString()}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:13, color:'#94a3b8'}}>Balance</span>
                      <span style={{fontSize:13, fontWeight:700, color:'#dc2626'}}>UGX {(s.fees_due - s.fees_paid).toLocaleString()}</span>
                    </div>
                    <div style={{marginTop:12}}>
                      <span style={{
                        padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:600,
                        background: statusBg(s.fees_status), color: statusColor(s.fees_status)
                      }}>{s.fees_status.charAt(0).toUpperCase() + s.fees_status.slice(1)}</span>
                    </div>
                  </div>

                  <div style={{background:'#f8fafc', borderRadius:12, padding:16}}>
                    <p style={{fontSize:13, fontWeight:600, color:'#475569', margin:'0 0 12px'}}>📋 Attendance</p>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                      <span style={{fontSize:13, color:'#94a3b8'}}>Days Present</span>
                      <span style={{fontSize:13, fontWeight:600, color:'#16a34a'}}>{s.days_present}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                      <span style={{fontSize:13, color:'#94a3b8'}}>Total Days</span>
                      <span style={{fontSize:13, fontWeight:600}}>{s.total_days}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                      <span style={{fontSize:13, color:'#94a3b8'}}>Attendance Rate</span>
                      <span style={{fontSize:13, fontWeight:700, color: s.attendance_percent >= 75 ? '#16a34a' : '#dc2626'}}>{s.attendance_percent}%</span>
                    </div>
                    <div style={{background:'#e2e8f0', borderRadius:100, height:8, overflow:'hidden'}}>
                      <div style={{height:'100%', borderRadius:100, width:`${s.attendance_percent}%`, background: s.attendance_percent >= 75 ? '#22c55e' : '#ef4444'}}></div>
                    </div>
                  </div>
                </div>

                <div style={{borderTop:'1px solid #e2e8f0', paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <p style={{fontSize:12, color:'#94a3b8', margin:0}}>Generated on {new Date().toLocaleDateString('en-UG', {dateStyle:'long'})}</p>
                  <p style={{fontSize:12, color:'#94a3b8', margin:0}}>Powered by Skool Manager</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {reportData.length === 0 && !loading && (
          <div className="table-card">
            <div className="empty-state">
              <div style={{fontSize:40, marginBottom:12}}>📄</div>
              <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No reports generated yet</div>
              <div>Select filters above and click "Generate Reports"</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}