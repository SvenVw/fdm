import { NavLink } from "react-router";
import { Separator } from "~/components/ui/separator";
import { Button } from "../../ui/button";
import { cn } from "@/app/lib/utils";

interface FarmTitleProps {
	title: string;
	description: string;
	action?: {
		to: string;
		label: string;
	};
}

export function FarmTitle({ title, description, action }: FarmTitleProps) {
	return (
		<div className="space-y-6 p-10 pb-0">
			<div className="flex items-center gap-4">
				<div className="space-y-0.5 ">
					<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
					<p className="text-muted-foreground">{description}</p>
				</div>
				{action && (
					<div className="ml-auto">
						<NavLink to={action.to} className="ml-auto">
							<Button>{action.label}</Button>
						</NavLink>
					</div>
				)}
			</div>
			<Separator className="my-6" />
		</div>
	);
}
