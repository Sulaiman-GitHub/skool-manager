import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { UserPlus, X } from 'lucide-react'

const empty = { full_name: '', gender: 'male', date_of_birth: '', parent_name: '', parent_phone: '', class_id: '' }

export default function Students() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => {
  const { data: s, error: e1 } = await supabase.from('students').select('*, classes(name)').order('created_at', { ascending: false })
  console.log('students:', s, 'error:', e1)
  setStudents(s || [])
  const { data: c, error: e2 } = await supabase.from('classes').select('*').order('name')
  console.log('classes:', c, 'error:', e2)
  setClasses(c || [])
}

  useEffect(() => { load() }, [])

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const openAdd = () => { setEditStudent(null); setForm(empty); setShowModal(true) }
  const openEdit = (s) => { setEditStudent(s); setForm({ full_name: s.full_name, gender: s.gender, date_of_birth: s.date_of_birth || '', parent_name: s.parent_name || '', parent_phone: s.parent_phone || '', class_id: s.class_id || '' }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditStudent(null); setForm(empty) }

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('school_id').single()
    const studentData = {
      full_name: form.full_name,
      gender: form.gender,
      date_of_birth: form.date_of_birth || null,
      parent_name: form.parent_name,
      parent_phone: form.parent_phone,
      school_id: profile.school_id,
      class_id: form.class_id || null,
    }
    if (editStudent) {
      const { error } = await supabase.from('students').update(studentData).eq('id', editStudent.id)
      if (error) { toast.error(error.message) } else { toast.success('Student updated!'); closeModal(); load() }
    } else {
      const { error } = await supabase.from('students').insert(studentData)
      if (error) { toast.error(error.message) } else { toast.success('Student added!'); closeModal(); load() }
    }
    setLoading(false)
  }

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This will also delete their fees and attendance records.')) return
    await supabase.from('fees').delete().eq('student_id', id)
    await supabase.from('attendance').delete().eq('student_id', id)
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('Student deleted!'); load() }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>{students.length} students enrolled</p>
        </div>
        <button className="btn btn-blue" onClick={openAdd}>
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-card-header">
            <div><h3>All Students</h3><p>Manage your student records</p></div>
          </div>
          <table>
            <thead>
              <tr>
                {['Student Name', 'Gender', 'Class', 'Parent / Guardian', 'Parent Phone', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div style={{fontSize:40, marginBottom:12}}>👨‍🎓</div>
                    <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No students yet</div>
                    <div>Click "Add Student" to enroll your first student</div>
                  </div>
                </td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td style={{textTransform:'capitalize'}}>{s.gender}</td>
                  <td>{s.classes?.name || <span style={{color:'#cbd5e1'}}>—</span>}</td>
                  <td>{s.parent_name || <span style={{color:'#cbd5e1'}}>—</span>}</td>
                  <td>{s.parent_phone || <span style={{color:'#cbd5e1'}}>—</span>}</td>
                  <td>
                    <button onClick={() => openEdit(s)}
                      style={{padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569'}}>
                      Edit
                    </button>
                    <button onClick={() => deleteStudent(s.id)} style={{padding:'6px 14px', borderRadius:8, border:'1.5px solid #fee2e2', background:'#fff5f5', cursor:'pointer', fontSize:13, fontWeight:600, color:'#dc2626', marginLeft:8}}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group"><label>Full Name</label>
                <input name="full_name" placeholder="e.g. Nakato Sarah" onChange={handle} value={form.full_name} required /></div>
              <div className="form-group"><label>Gender</label>
                <select name="gender" onChange={handle} value={form.gender}>
                  <option value="male">Male</option><option value="female">Female</option>
                </select></div>
              <div className="form-group"><label>Class</label>
                <select name="class_id" onChange={handle} value={form.class_id}>
                  <option value="">Select Class (optional)</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
                </select></div>
              <div className="form-group"><label>Date of Birth</label>
                <input name="date_of_birth" type="date" onChange={handle} value={form.date_of_birth} /></div>
              <div className="form-group"><label>Parent / Guardian Name</label>
                <input name="parent_name" placeholder="e.g. Nakato Mary" onChange={handle} value={form.parent_name} /></div>
              <div className="form-group"><label>Parent Phone</label>
                <input name="parent_phone" placeholder="e.g. 0701234567" onChange={handle} value={form.parent_phone} /></div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}