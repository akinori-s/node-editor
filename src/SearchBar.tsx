import React, { ChangeEvent } from "react";

interface SearchBarProps {
	searchQuery: string;
	onSearch: (val: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearch }) => {
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onSearch(e.target.value);
	};

	return (
		<div>
			<input
				type="text"
				placeholder="Search nodes..."
				value={searchQuery}
				onChange={handleChange}
				className="w-full border border-gray-300 rounded px-2 py-1"
			/>
		</div>
	);
};

export default SearchBar;
