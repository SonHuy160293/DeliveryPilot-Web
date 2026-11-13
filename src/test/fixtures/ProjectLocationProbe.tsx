import { useLocation, useNavigate } from "react-router";
export function ProjectLocationProbe() {
  const location = useLocation(),
    navigate = useNavigate();
  return (
    <>
      <output aria-label="Current path">{location.pathname}</output>
      <output aria-label="Current search">{location.search}</output>
      <button
        onClick={() => {
          void navigate(-1);
        }}
      >
        Go back
      </button>
    </>
  );
}
