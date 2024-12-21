import React, { useState } from "react";
import Flowchart from "./Flowchart";
import Sidebar from "./Sidebar";
import SearchBar from "./SearchBar";
import { NodeData } from "./types";

function App() {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortMethod, setSortMethod] = useState<"default" | "alphabetical">("default");

	return (
		<div className="flex h-screen w-screen overflow-hidden">
			{/* Sidebar */}
			<div className="w-1/4 bg-gray-100 border-r border-gray-300 flex flex-col">
				<div className="p-4">
					<SearchBar searchQuery={searchQuery} onSearch={setSearchQuery} />
					<div className="mt-4">
						<label className="font-bold mr-2">Sort Nodes:</label>
						<select
							value={sortMethod}
							onChange={(e) => setSortMethod(e.target.value as "default" | "alphabetical")}
							className="border border-gray-300 rounded px-2 py-1"
						>
							<option value="default">Created Order</option>
							<option value="alphabetical">Alphabetical</option>
						</select>
					</div>
				</div>
				<Sidebar searchQuery={searchQuery} sortMethod={sortMethod} />
			</div>

			{/* Main Flowchart Canvas */}
			<div className="flex-1 bg-white">
				<Flowchart />
			</div>
		</div>
	);
}

export default App;
