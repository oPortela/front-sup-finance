export default function Feedback({ tipo, mensagem, onFechar }) {
  if (!mensagem) return null;
  return (
    <div className={`feedback feedback-${tipo}`} role="alert">
      <span>{mensagem}</span>
      <button className="feedback-close" onClick={onFechar} aria-label="Fechar">×</button>
    </div>
  );
}
