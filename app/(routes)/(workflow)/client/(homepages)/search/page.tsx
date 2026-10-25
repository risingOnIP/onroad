

import PropertySearches from "./components/PropertySearches";


export default function ClientSearchPage() {

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        Active Property Searches
      </h2>
      <PropertySearches statusShown="active" shouldShowAddCard={true} />

      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        Past Property Searches
      </h2>
      <PropertySearches statusShown="closed" shouldShowAddCard={false} />
    </>
  );
}
