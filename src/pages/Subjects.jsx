import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

const empty = { name: '' }

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
  }

  useEffect(() => { load() }, [])

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })
  const openAdd = () => { setEditSubject(null); setForm(empty); setShowModal(true) }
  const openEdit = (s) => { setEditSubject(s); setForm({ name: s.name }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditSubject(null); setForm(empty) }

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('school_id').single()
    const subjectData = { name: form.name, school_id: profile.school_id }
    if (editSubject) {
      const { error } = await supabase.from('subjects').update(subjectData).eq('id', editSubject.id)
      if (error) { toast.error(error.message) } else { toast.success('Subject updated!'); closeModal(); load() }
    } else {
      const { error } = await supabase.from('subjects').insert(subjectData)
      if (error) { toast.error(error.message) } else { toast.success('Subject added!'); closeModal(); load() }
    }
    setLoading(false)
  }

  const deleteSubject = async (id) => {
    if (!window.confirm('Delete this subject? All marks for this subject will also be deleted.')) return
    await supabase.from('marks').delete().eq('subject_id', id)
    await supabase.from('teacher_assignments').delete().eq('subject_id', id)
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('Subject deleted!'); load() }
  }

  const ugandanSubjects = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Christian Religious Education', 'Islamic Religious Education', 'Agriculture', 'Computer Studies', 'Art & Design', 'Music', 'Physical Education', 'Luganda', 'SST']

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Subjects</h2>
          <p>{subjects.length} subjects registered</p>
        </div>
        <button className="btn btn-blue" onClick={openAdd}>
          <Plus size={16} /> Add Subject
        </button>
      </div>

      <div className="page-body">
        {subjects.length === 0 && (
          <div className="table-card" style={{marginBottom:20}}>
            <div className="table-card-header">
              <div><h3>Quick Add Ugandan Subjects</h3><p>Click to add common subjects instantly</p></div>
            </div>
            <div style={{padding:'20px', display:'flex', flexWrap:'wrap', gap:8}}>
              {ugandanSubjects.map(s => (
                <button key={s} onClick={async () => {
                  const { data: profile } = await supabase.from('profiles').select('school_id').single()
                  await supabase.from('subjects').insert({ name: s, school_id: profile.school_id })
                  load()
                  toast.success(`${s} added!`)
                }} style={{padding:'8px 16px', borderRadius:100, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, fontWeight:500, color:'#475569'}}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="table-card">
          <div className="table-card-header">
            <div><h3>All Subjects</h3><p>Manage subjects taught at your school</p></div>
          </div>
          <table>
            <thead>
              <tr>{['Subject Name', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr><td colSpan={2}>
                  <div className="empty-state">
                    <div style={{fontSize:40, marginBottom:12}}>📚</div>
                    <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No subjects yet</div>
                    <div>Use the quick add buttons above or click "Add Subject"</div>
                  </div>
                </td></tr>
              ) : subjects.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    <button onClick={() => openEdit(s)}
                      style={{padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569'}}>
                      Edit
                    </button>
                    <button onClick={() => deleteSubject(s.id)}
                      style={{padding:'6px 14px', borderRadius:8, border:'1.5px solid #fee2e2', background:'#fff5f5', cursor:'pointer', fontSize:13, fontWeight:600, color:'#dc2626', marginLeft:8}}>
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
              <h3>{editSubject ? 'Edit Subject' : 'Add Subject'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group"><label>Subject Name</label>
                <input name="name" placeholder="e.g. Mathematics" onChange={handle} value={form.name} required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editSubject ? 'Update Subject' : 'Add Subject'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
