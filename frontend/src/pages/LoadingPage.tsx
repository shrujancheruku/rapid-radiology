import {motion} from "framer-motion";

export default function LoadingPage() {
    return (
        <motion.div
            key="loader"
            initial={{opacity: 0, y: 0}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 0}}
            transition={{duration: 1}}
        >
            <div className="flex items-center justify-center min-h-[40rem]">
                <motion.svg
                    width={100}
                    height={100}
                    viewBox="0 0 100 100"
                    className="origin-center"
                    animate={{rotate: 360}}
                    transition={{repeat: Infinity, duration: 1.8, ease: "easeInOut"}}

                >
                    <defs>
                        {/* Softer glow filter */}
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow
                                dx="0"
                                dy="0"
                                stdDeviation="1.5"
                                floodColor="stroke-border"
                                floodOpacity="0.2"
                            />
                        </filter>
                    </defs>

                    {/* Background circle (muted stroke) */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        strokeWidth="8"
                        fill="none"
                        className="stroke-muted"
                    />

                    {/* Arc 1 (primary with subtle pulsing glow) */}
                    <motion.path
                        d="M50 10 A40 40 0 0 1 90 50"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        className="stroke-primary"
                        filter="url(#glow)"
                        animate={{opacity: [0.7, 1, 0.7]}}
                        transition={{repeat: Infinity, duration: 1.8, ease: "easeInOut"}}
                    />

                    {/* Arc 2 (opposite, primary with subtle pulsing glow) */}
                    <motion.path
                        d="M50 90 A40 40 0 0 1 10 50"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        className="stroke-primary"
                        filter="url(#glow)"
                        animate={{opacity: [0.7, 1, 0.7]}}
                        transition={{repeat: Infinity, duration: 1.8, ease: "easeInOut"}}
                    />
                </motion.svg>
            </div>
        </motion.div>
    );
}