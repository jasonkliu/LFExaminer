import { useMemo, useState } from 'react'
import theatersCsv from '../Theaters.csv?raw'
import { parseCsv } from './csv.js'

const records = parseCsv(theatersCsv)
const columns = ['Number', 'Country', 'City', 'State', 'Organization', 'Proj', 'Fmt', '2D/3D', 'Flat/ Dome', 'Seats', 'Screen Width (m)', 'Screen Height (m)', 'Screen Size Review', 'LieMAX', 'Opened', 'Type']
const laserFormats = (format) => format.includes('DL')
const multipleLaser = (format) => format.includes('DL2') || format.includes('DL5') || format.includes('DL8')
const unique = (key, includeBlank = false) => [...new Set(records.map((record) => record[key] || '').filter((value) => includeBlank || value))].sort()
const countBy = (data, key) => Object.entries(data.reduce((counts, record) => ({ ...counts, [record[key] || 'Unknown']: (counts[record[key] || 'Unknown'] || 0) + 1 }), {})).sort(([, a], [, b]) => b - a)

function Select({ label, value, onChange, options, children }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{children}<option value="">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function BarChart({ title, entries }) {
  const maximum = entries[0]?.[1] ?? 1
  return <section className="panel chart"><h2>{title}</h2>{entries.map(([label, count]) => <div className="bar" key={label}><span title={label}>{label}</span><div className="track"><div className="fill" style={{ width: `${count / maximum * 100}%` }} /></div><b>{count}</b></div>)}</section>
}

export default function App() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [format, setFormat] = useState('')
  const [laserType, setLaserType] = useState('')
  const [type, setType] = useState('__exclude_n')
  const [review, setReview] = useState('')
  const [hideLieMAX, setHideLieMAX] = useState(true)
  const [laserOnly, setLaserOnly] = useState(true)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((record) => {
      const fmt = record.Fmt || ''
      const matchesLaserType = !laserType || (laserType === 'DL2' ? multipleLaser(fmt) : laserFormats(fmt) && !multipleLaser(fmt))
      return (!query || Object.values(record).join(' ').toLowerCase().includes(query))
        && (!country || record.Country === country)
        && (!format || fmt === format)
        && matchesLaserType
        && (type === '__exclude_n' ? record.Type !== 'N' : !type || record.Type === type)
        && (!review || record['Screen Size Review'] === review)
        && (!hideLieMAX || record.LieMAX !== 'Yes')
        && (!laserOnly || laserFormats(fmt))
    })
  }, [search, country, format, laserType, type, review, hideLieMAX, laserOnly])

  const totalSeats = filtered.reduce((total, record) => total + (Number.parseInt(String(record.Seats).replace(/\D/g, ''), 10) || 0), 0)
  const cards = [['Matching theaters', filtered.length], ['Countries', new Set(filtered.map((record) => record.Country)).size], ['Digital venues', filtered.filter((record) => record.Fmt.startsWith('D')).length], ['Known seats', totalSeats]]

  return <main>
    <header><h1>LF Examiner Theater Explorer</h1><p>Explore the theater records by location, format, and venue type.</p></header>
    <section className="filters">
      <label className="search">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="City, organization, country…" /></label>
      <Select label="Country" value={country} onChange={setCountry} options={unique('Country')} />
      <Select label="Format" value={format} onChange={setFormat} options={unique('Fmt')} />
      <label>Laser type<select value={laserType} onChange={(event) => setLaserType(event.target.value)}><option value="">All laser types</option><option value="DL">DL / single laser</option><option value="DL2">DL2 / multiple laser (incl. DL5/DL8)</option></select></label>
      <label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option value="__exclude_n">All except N</option><option value="">All types</option>{unique('Type').map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <Select label="Screen size review" value={review} onChange={setReview} options={unique('Screen Size Review')} />
      <label className="toggle"><input type="checkbox" checked={hideLieMAX} onChange={(event) => setHideLieMAX(event.target.checked)} />Hide LieMAX (&lt; 22.8 m wide)</label>
      <label className="toggle"><input type="checkbox" checked={laserOnly} onChange={(event) => setLaserOnly(event.target.checked)} />Laser formats (DL*)</label>
    </section>
    <section className="cards">{cards.map(([label, value]) => <article className="card" key={label}><span>{label}</span><b>{Number(value).toLocaleString()}</b></article>)}</section>
    <section className="charts"><BarChart title="Top countries" entries={countBy(filtered, 'Country').slice(0, 12)} /><BarChart title="Formats" entries={countBy(filtered, 'Fmt').slice(0, 12)} /></section>
    <p className="status">Showing {Math.min(filtered.length, 200).toLocaleString()} of {filtered.length.toLocaleString()} matching records.</p>
    <section className="panel table-panel"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{filtered.slice(0, 200).map((record) => <tr className={record['Screen Size Review'] ? 'review' : ''} key={record.Number}>{columns.map((column) => <td key={column}>{record[column]}</td>)}</tr>)}</tbody></table></section>
  </main>
}
