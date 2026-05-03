import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

const empty = { name: '', stream: '' }

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editClass, setEditClass] = useState(null)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('classes').select('*').order('name')
    setClasses(data || [])
  }

  useEffect(() => { load() }, [])

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const openAdd = () => { setEditClass(null); setForm(empty); setShowModal(true) }
  const openEdit = (c) => { setEditClass(c); setForm({ name: c.name, stream: c.stream || '' }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditClass(null); setForm(empty) }

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('school_id').single()
    const classData = { name: form.name, stream: form.stream, school_id: profile.school_id }
    if (editClass) {
      const { error } = await supabase.from('classes').update(classData).eq('id', editClass.id)
      if (error) { toast.error(error.message) } else { toast.success('Class updated!'); closeModal(); load() }
    } else {
      const { error } = await supabase.from('classes').insert(classData)
      if (error) { toast.error(error.message) } else { toast.success('Class added!'); closeModal(); load() }
    }
    setLoading(false)
  }

  const deleteClass = async (id) => {
    if (!window.confirm('Delete this class? Students in this class will be unassigned.')) return
    await supabase.from('students').update({ class_id: null }).eq('class_id', id)
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('Class deleted!'); load() }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Classes</h2>
          <p>{classes.length} classes registered</p>
        </div>
        <button className="btn btn-blue" onClick={openAdd}>
          <Plus size={16} /> Add Class
        </button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-card-header">
            <div><h3>All Classes</h3><p>Manage your school classes and streams</p></div>
          </div>
          <table>
            <thead>
              <tr>
                {['Class Name', 'Stream', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr><td colSpan={3}>
                  <div className="empty-state">
                    <div style={{fontSize:40, marginBottom:12}}>🏫</div>
                    <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No classes yet</div>
                    <div>Click "Add Class" to create your first class</div>
                  </div>
                </td></tr>
              ) : classes.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.stream || <span style={{color:'#cbd5e1'}}>—</span>}</td>
                  <td>
                    <button onClick={() => openEdit(c)}
                      style={{padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569'}}>
                      Edit
                    </button>
                    <button onClick={() => deleteClass(c.id)}
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
              <h3>{editClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group"><label>Class Name</label>
                <input name="name" placeholder="e.g. Senior 1, Primary 3" onChange={handle} value={form.name} required /></div>
              <div className="form-group"><label>Stream (optional)</label>
                <input name="stream" placeholder="e.g. A, B, East, West" onChange={handle} value={form.stream} /></div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editClass ? 'Update Class' : 'Add Class'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}