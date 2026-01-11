export default function DebugBubbles() {
    return (
        <div className="relative w-full h-screen bg-red-900 overflow-hidden flex items-center justify-center">
            <h1 className="z-50 text-white text-2xl font-bold">Bubble Test Zone</h1>

            {/* 🚨 FORCED MOBILE BUBBLES (RAW CSS) 🚨 */}
            {/* 🫧 SHARP MOBILE BUBBLES (DEFINED CIRCLES) 🫧 */}
            <div className="fixed inset-0 z-[9999] pointer-events-none block overflow-hidden">
                {/* Cyan Bubble - Top Left (Solid & Sharp) */}
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-xl opacity-80 animate-pulse border border-white/20"></div>

                {/* Purple Bubble - Bottom Right (Solid & Sharp) */}
                <div className="absolute top-[40%] -right-10 w-56 h-56 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur-xl opacity-80 animate-pulse border border-white/20"></div>

                {/* Small Floating Orb - Center */}
                <div className="absolute top-[25%] left-[20%] w-16 h-16 bg-white rounded-full blur-md opacity-40 animate-bounce"></div>
            </div>
        </div>
    );
}
