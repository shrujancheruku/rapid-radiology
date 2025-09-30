import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingPage() {
    return (
        <div className="flex min-h-80">
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className='m-auto'
            >
                <Loader2 className="w-30 h-30 text-primary" />
            </motion.div>
        </div>
    );
}