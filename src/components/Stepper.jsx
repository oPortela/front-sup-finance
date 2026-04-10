/**
 * etapaAtual: 0 = RCA, 1 = Cliente, 2 = Formulário
 */
const passos = ['Selecionar RCA', 'Selecionar Cliente', 'Preencher Formulário'];

export default function Stepper({ etapaAtual }) {
  return (
    <div className="stepper">
      {passos.map((label, i) => {
        const status = i < etapaAtual ? 'done' : i === etapaAtual ? 'active' : '';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < passos.length - 1 ? '1' : 'none' }}>
            <div className={`step ${status}`}>
              <div className="step-circle">
                {i < etapaAtual ? '✓' : i + 1}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < passos.length - 1 && (
              <div className={`step-line ${i < etapaAtual ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
