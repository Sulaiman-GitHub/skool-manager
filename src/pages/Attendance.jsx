import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

export default function Attendance() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from('students').select('id, full_name, classes(name)')
      setStudents(s || [])
      const { data: a } = await supabase.from('attendance').select('*').eq('date', date)
      const map = {}
      a?.forEach(r => { map[r.student_id] = r.status })
      setAttendance(map)
    }
    load()
  }, [date])

  const mark = (id, status) => setAttendance(prev => ({ ...prev, [id]: status }))

  const save = async () => {
    setSaving(true)
    const { data: profile } = await supabase.from('profiles').select('school_id').single()
    const records = students.map(s => ({
      student_id: s.id, school_id: profile.school_id,
      date, status: attendance[s.id] || 'absent'
    }))
    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
    if (error) { toast.error(error.message) } else { toast.success('Attendance saved successfully!') }
    setSaving(false)
  }

  const present = Object.values(attendance).filter(s => s === 'present').length
  const absent = Object.values(attendance).filter(s => s === 'absent').length

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p>{present} present · {absent} absent · {students.length - present - absent} unmarked</p>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="date-input" />
          <button className="btn btn-blue" onClick={save} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-card-header">
            <div><h3>Class Register</h3><p>Mark each student's attendance for {date}</p></div>
          </div>
          <table>
            <thead>
              <tr><th>Student Name</th><th>Class</th><th>Mark Attendance</th></tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={3}><div className="empty-state">
                  <div style={{fontSize:40, marginBottom:12}}>📋</div>
                  <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No students found</div>
                  <div>Add students first to take attendance</div>
                </div></td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td>{s.classes?.name || <span style={{color:'#cbd5e1'}}>—</span>}</td>
                  <td>
                    <div style={{display:'flex', gap:8}}>
                      {['present', 'absent', 'late'].map(status => (
                        <button key={status} onClick={() => mark(s.id, status)}
                          className={`att-btn ${attendance[s.id] === status ? status : ''}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}