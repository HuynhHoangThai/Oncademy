import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { useUser, useClerk } from '@clerk/clerk-react'

const PathwayCard = ({ pathway }) => {
    const { currency, calculateRating, toggleFavoritePathway, isPathwayFavorite, favoritePathways, addToViewHistory } = useContext(AppContext);

    const { user } = useUser();
    const { openSignIn } = useClerk();

    const isFavorite = isPathwayFavorite(pathway._id);

    const handleFavoriteClick = (e) => {
        e.preventDefault();
        if (!user) {
            openSignIn();
            return;
        }
        toggleFavoritePathway(pathway._id);
    };

    const handleLinkClick = () => {
        scrollTo(0, 0);
        addToViewHistory(pathway._id, true);
    };

    // Pathways use "Phases" instead of ratings usually, but we can show rating if available
    // For now, let's show Phases count as key stat

    return (
        <div className="relative bg-white border border-teal-200 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden group h-full flex flex-col">
            <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                COMBO
            </div>

            <button
                onClick={handleFavoriteClick}
                className={`absolute top-3 right-3 z-10 p-1.5 rounded-full transition-all duration-200 shadow-sm
            ${isFavorite
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                    }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={isFavorite ? "0" : "2"}
                >
                    <path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            </button>

            <Link to={'/pathway/' + pathway._id} onClick={handleLinkClick} className="flex flex-col h-full">
                <div className="overflow-hidden rounded-t-lg relative">
                    <img
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        src={pathway.pathwayThumbnail}
                        alt={pathway.pathwayTitle}
                        loading="lazy"
                    />
                </div>
                <div className="p-4 text-left flex flex-col flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-teal-600 transition-colors">
                        {pathway.pathwayTitle}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{pathway.educator?.name || ''}</p>
                    <div className="flex items-center gap-2 mb-3 mt-auto">
                        <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded border border-teal-100 font-medium">
                            {pathway.phaseCount || pathway.phases?.length || 0} Phases
                        </span>
                        <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-100">
                            {pathway.totalLectures || 0} Lectures
                        </span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <p className='text-lg font-semibold text-gray-800'>
                            {currency}{(pathway.pathwayPrice - pathway.discount * pathway.pathwayPrice / 100).toFixed(2)}
                        </p>
                        {pathway.discount > 0 && <p className="text-sm text-gray-400 line-through font-normal">{currency}{pathway.pathwayPrice}</p>}
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default PathwayCard
