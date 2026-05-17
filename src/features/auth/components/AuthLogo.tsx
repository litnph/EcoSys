import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";

export function AuthLogo() {
  return (
    <Link
      href={ROUTES.dashboard.home}
      className="font-display text-2xl font-semibold tracking-tight text-warm-900"
    >
      Personal Finance
    </Link>
  );
}
