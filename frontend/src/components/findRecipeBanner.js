import { motion } from "framer-motion";

export default function FindRecipeBanner() {
  return (
    <motion.div
      className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      {/* Gradient Header with Animation */}
      <motion.div
        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-6"
        initial={{ backgroundPosition: "0% 50%" }}
        animate={{ backgroundPosition: "100% 50%" }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
        style={{ backgroundSize: "200% 200%" }}
      >
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          ✨ Find Your Perfect Recipe 🍲
        </motion.h2>
        <motion.p
          className="text-center text-sm md:text-base text-white/90 mt-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Select your mood, upload a photo, or enter ingredients.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
