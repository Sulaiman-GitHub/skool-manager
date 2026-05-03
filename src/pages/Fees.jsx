import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

const empty = { student_id: '', term: 'Term 1', year: new Date().getFullYear(), amount_due: '', amount_paid: '' }

export default function Fees() {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('fees').select('*, students(full_name)').order('created_at', { ascending: false })
    setFees(data || [])
    const { data: s } = await supabase.from('students').select('id, full_name')
    setStudents(s || [])
  }

  useEffect(() => { load() }, [])
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('school_id').single()
    const due = parseInt(form.amount_due)
    const paid = parseInt(form.amount_paid) || 0
    const status = paid >= due ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
    const { error } = await supabase.from('fees').insert({ ...form, school_id: profile.school_id, amount_due: due, amount_paid: paid, status })
    if (error) { toast.error(error.message) } else { toast.success('Fee record saved!'); setShowModal(false); setForm(empty); load() }
    setLoading(false)
  }

  return (
    <>
      <div className="page-header">
        <div><h2>Fees</h2><p>{fees.length} fee records</p></div>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Fee Record
        </button>
      </div>

      <div className="page-body">
        <div className="table-card">
          <div className="table-card-header">
            <div><h3>Fee Records</h3><p>Track payments and outstanding balances</p></div>
          </div>
          <table>
            <thead>
              <tr>{['Student', 'Term', 'Year', 'Amount Due', 'Amount Paid', 'Balance', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">
                  <div style={{fontSize:40, marginBottom:12}}>💰</div>
                  <div style={{fontWeight:600, color:'#475569', marginBottom:4}}>No fee records yet</div>
                  <div>Add students first, then record their fees</div>
                </div></td></tr>
              ) : fees.map(f => (
                <tr key={f.id}>
                  <td>{f.students?.full_name}</td>
                  <td>{f.term}</td>
                  <td>{f.year}</td>
                  <td>UGX {f.amount_due.toLocaleString()}</td>
                  <td>UGX {f.amount_paid.toLocaleString()}</td>
                  <td>UGX {(f.amount_due - f.amount_paid).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${f.status === 'paid' ? 'badge-green' : f.status === 'partial' ? 'badge-yellow' : 'badge-red'}`}>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
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
              <h3>Add Fee Record</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group"><label>Student</label>
                <select name="student_id" onChange={handle} required>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select></div>
              <div className="form-group"><label>Term</label>
                <select name="term" onChange={handle} value={form.term}>
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select></div>
              <div className="form-group"><label>Year</label>
                <input name="year" type="number" onChange={handle} value={form.year} /></div>
              <div className="form-group"><label>Amount Due (UGX)</label>
                <input name="amount_due" type="number" placeholder="e.g. 250000" onChange={handle} required /></div>
              <div className="form-group"><label>Amount Paid (UGX)</label>
                <input name="amount_paid" type="number" placeholder="e.g. 150000" onChange={handle} /></div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}