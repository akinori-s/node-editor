import { SidebarProvider } from "@/components/ui/sidebar"
import Flowchart from "./Flowchart";
import AppSidebar from "./Sidebar";

function App() {
	return (
		<div className="flex h-screen w-screen overflow-hidden">
			<SidebarProvider>
				{/* Sidebar */}
				<AppSidebar />

				{/* Main Flowchart Canvas */}
				<Flowchart />
			</SidebarProvider>
		</div>
	);
}

export default App;
