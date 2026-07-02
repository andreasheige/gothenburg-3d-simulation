/** Full-screen loading splash shown while the city warms up. */
export function Loader(): React.JSX.Element {
  return (
    <div className="loader">
      <h1>GÖTEBORGS-SIMULATORN</h1>
      <p>Laddar staden…</p>
      <div className="bar">
        <i style={{ width: '70%' }} />
      </div>
    </div>
  );
}
