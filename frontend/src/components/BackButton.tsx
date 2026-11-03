import { useLocation, useNavigate } from 'react-router-dom';

// Goes back one page. If this is the first page of the visit, goes to the fallback page instead.
export default function BackButton({ fallback = '/' }: { fallback?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback);
  }

  return (
    <button type="button" className="v-back" onClick={goBack}>
      ← Back
    </button>
  );
}
