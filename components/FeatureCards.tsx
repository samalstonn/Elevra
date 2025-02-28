import { motion } from 'framer-motion';

const FeatureCards = () => {
  const cards = [
    {
      title: "Take Control of Your Community",
      description: "Push back against big donors and outside interests - shape policies that matter to you and those in your life.",
      emoji: "🌍"
    },
    {
      title: 'Boost the Local Economy',
      description: 'Keep money flowing back into your area, creating jobs and funding essential services.',
      emoji: '💰',
    },
    {
      title: 'Maximize Impact',
      description: 'Local officials can adapt quickly without big-government red tape.',
      emoji: '⚡',
    },
    {
      title: 'Your Help Goes Farther',
      description: 'Local organizations often have lower operational costs, meaning a higher percentage of your donation goes directly to community services.',
      emoji: '📊',
    },
    {
      title: 'Strengthen Neighborhood Ties',
      description: 'Get to know politicians and community leaders personally. Foster collaboration and trust on issues that matter, creating a more vibrant, united neighborhood.',
      emoji: '🏡',
    },
    {
      title: 'Foster Civic Engagement',
      description: 'Supporting local candidates encourages active community participation and strengthens democracy.',
      emoji: '🤝',
    },
  ];

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.2 },
        },
      }}
      viewport={{ once: true }}
      className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Why Get Involved With Local Elections
        </h2>
      </motion.div>

      {/* Features Grid - Fixed 3x2 Layout on Large Screens */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
          },
        }}
        viewport={{ once: true }}
        className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 
                   gap-4 sm:gap-6 max-w-5xl mx-auto"
      >
        {cards.map((card, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 30, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeInOut', delay: index * 0.1 } }
            }}
            whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 100 } }}
            whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 200 } }}
            className="relative border rounded-lg shadow-md bg-gray-100 p-4 sm:p-6 
                       flex flex-col items-center text-center 
                       aspect-[4/5] md:aspect-square transition-all"
          >
            <motion.span
              variants={{
                hidden: { scale: 0.8, opacity: 0 },
                visible: { scale: 1, opacity: 1, transition: { duration: 0.4, delay: index * 0.1 + 0.2 } }
              }}
              className="text-3xl sm:text-4xl"
            >
              {card.emoji}
            </motion.span>
            <h3 className="mt-2 text-base sm:text-lg font-semibold">{card.title}</h3>
            <p className="mt-1 text-gray-600 text-sm">{card.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default FeatureCards;