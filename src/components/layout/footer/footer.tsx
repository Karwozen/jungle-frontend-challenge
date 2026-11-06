import { Link } from "@tanstack/react-router";
import FooterColumns from "./footer-columns";
import FooterHighlights from "./footer-highlights";

function Footer() {
	return (
		<footer className="mx-auto mt-24 hidden w-full max-w-300 px-6 pb-8 md:block xl:px-0">
			<FooterHighlights />

			<div className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 items-center justify-items-center gap-6 bg-surface-dark p-8 text-sm">
				<Link
					to="/"
					className="w-fit rounded-sm px-6 text-xs font-bold tracking-widest outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					KURIO
				</Link>
				<p>
					Feito para colecionadores,
					<br /> criadores e cultura
				</p>

				<a
					href="mailto:contato@email.com"
					className="rounded-sm outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					contato@email.com
				</a>
				<a
					href="tel:+551140028922"
					className="rounded-sm outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					+55 11 4002 8922
				</a>
			</div>

			<FooterColumns />

			<p className="mt-8 text-center text-xs  text-foreground">
				© 2026 Kurio. Propriedade digital para todos.
			</p>
		</footer>
	);
}

export default Footer;
