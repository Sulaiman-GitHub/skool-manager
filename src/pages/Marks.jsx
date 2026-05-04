import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

export default function Marks() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('Term 1')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: prof } = await supabase.from('profiles').select('*, schools(name)').single()
      setProfile(prof)
      const { data: c } = await supabase.from('classes').select('*').order('name')
      setClasses(c || [])
      const { data: s } = await supabase.from('subjects').select('*').order('name')
      setSubjects(s || [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    const loadStudents = async () => {
      const { data } = await supabase.from('students').select('*').eq('class_id', selectedClass).order('full_name')
      setStudents(data || [])
      setMarks({})
    }
    loadStudents()
  }, [selectedClass])

  useEffect(() => {
    if (!selectedClass || !selectedSubject) return
    const loadMarks = async () => {
      const { data } = await supabase.from('marks').select('*')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term', selectedTerm)
        .eq('year', selectedYear)
      const map = {}
      data?.forEach(m => { map[m.student_id] = m.score })
      setMarks(map)
    }
    loadMarks()
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear])

  const setMark = (studentId, value) => {
    const score = parseInt(value)
    if (value === '') { setMarks(prev => ({ ...prev, [studentId]: '' })); return }
    if (score < 0 || score > 100) { toast.error('Score must be between 0 and 100'); return }
    setMarks(prev => ({ ...prev, [studentId]: score }))
  }

  const save = async () => {
    if (!selectedClass || !selectedSubject) { toast.error('Please select a class and subject'); return }
    setSaving(true)
    const records = students
      .filter(s => marks[s.id] !== undefined && marks[s.id] !== '')
      .map(s => ({
        student_id: s.id,
        subject_id: selectedSubject,
        class_id: selectedClass,
        teacher_id: profile?.id,
        school_id: profile?.school_id,
        term: selectedTerm,
        year: selectedYear,
        score: marks[s.id]
      }))
    const { error } = await supabase.from('marks').upsert(records, { onConflict: 'student_id,subject_id,term,year' })
    if (error) { toast.error(error.message) } else { toast.success('Marks saved successfully!') }
    setSaving(false)
  }

  const getGrade = (score) => {
    if (score >= 80) return { grade: 'D1', color: '#16a34a' }
    if (score >= 70) return { grade: 'D2', color: '#16a34a' }
    if (score >= 60) return { grade: 'C3', color: '#2563eb' }
    if (score >= 55) return { grade: 'C4', color: '#2563eb' }
    if (score >= 50) return { grade: 'C5', color: '#2563eb' }
    if (score >= 45) return { grade: 'C6', color: '#ca8a04' }
    if (score >= 40) return { grade: 'P7', color: '#ca8a04' }
    if (score >= 35) return { grade: 'P8', color: '#dc2626' }
    return { grade: 'F9', color: '#dc2626' }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Marks Entry</h2>
          <p>Enter student scores per subject and term</p>
        </div>
        <button className="btn btn-blue" onClick={save} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
      </div>

      <div className="page-body">
        <div className="table-card" style={{marginBottom:24}}>
          <div className="table-card-header">
            <div><h3>Select Filters</h3><p>Choose class, subject and term to enter marks</p></div>
          </div>
          <div style={{padding:'24px', display:'flex', gap:16, flexWrap:'wrap'}}>
            <div className="form-group" style={{margin:0, flex:1, minWidth:160}}>
              <label>Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
              </select>
            </div>
            <div className="form-group" style={{margin:0, flex:1, minWidth:160}}>
              <label>Subject</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{margin:0, flex:1, minWidth:160}}>
              <label>Term</label>
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                <option>Term 1</option><option>Term 2</option><option>Term 3</option>
              </select>
            </div>
            <div className="form-group" style={{margin:0, flex:1, minWidth:120}}>
              <label>Year</label>
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h3>Student Marks</h3>
              <p>{students.length} students in selected class</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                {['Student Name', 'Score (0-100)', 'Grade', 'Remarks'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {!selectedClass ? (
                <tr><td colSpan={4}>
                  <div className="empty-state">
                    <div style={{fontSize:40, marginBottom:12}}>📝</div>
                    <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>Select a class to begin</div>
                    <div>Choose a class and subject from the filters above</div>
                  </div>
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="empty-state">
                    <div style={{fontSize:40, marginBottom:12}}>👨‍🎓</div>
                    <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No students in this class</div>
                    <div>Add students and assign them to this class first</div>
                  </div>
                </td></tr>
              ) : students.map(s => {
                const score = marks[s.id]
                const { grade, color } = score !== undefined && score !== '' ? getGrade(score) : { grade: '—', color: '#94a3b8' }
                const remarks = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 50 ? 'Average' : score >= 40 ? 'Below Average' : score !== undefined && score !== '' ? 'Fail' : '—'
                return (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td>
                      <input
                        type="number" min="0" max="100"
                        value={marks[s.id] ?? ''}
                        onChange={e => setMark(s.id, e.target.value)}
                        placeholder="Enter score"
                        style={{width:120, padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', fontFamily:'Inter, sans-serif'}}
                      />
                    </td>
                    <td>
                      <span style={{fontWeight:700, color, fontSize:15}}>{grade}</span>
                    </td>
                    <td style={{color:'#64748b'}}>{remarks}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
