import { useLocation, useNavigationType, useNavigate } from "react-router";
export function EngagementLocationProbe() {
  const location = useLocation();
  const type = useNavigationType();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current search">{location.search}</output>
      <output aria-label="Navigation type">{type}</output>
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
