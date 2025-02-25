import { motion } from 'framer-motion';

const FeatureCards = () => {
  const cards = [
    {
      "title": "Take Control of Your Community",
      "description": "Push back against big donors and outside interests - shape policies that matter to you and those in your life.",
      "emoji": "🌍"
    },
    {
      title: 'Boost the Local Economy',
      description:
        'Keep money flowing back into your area, creating jobs and funding essential services.',
      emoji: '💰',
    },
    {
      title: 'Maximize Impact',
      description:
        'Local officials can adapt quickly without big-government red tape.',
      emoji: '⚡',
    },
    {
      title: 'Your Help Goes Farther',
      description:
        'Local organizations often have lower operational costs, meaning a higher percentage of your donation goes directly to community services.',
      emoji: '📊',
    },
    {
      title: 'Strengthen Neighborhood Ties',
      description:
        'Get to know politicians and community leaders personally. Foster collaboration and trust on issues that matter, creating a more vibrant, united neighborhood.',
      emoji: '🏡',
    },
    {
      title: 'Foster Civic Engagement',
      description:
        'Supporting local candidates encourages active community participation and strengthens democracy.',
      emoji: '🤝',
    },
  ];

  return (
    <section className="w-full bg-white py-32 px-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center"
      >
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
        Why Get Involved With Local Elections 
        </h2>
      </motion.div>

      {/* Features Grid - 2x3 Layout with Animations */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.15,
              ease: 'easeOut',
            }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotateX: 5 }}
            whileTap={{ scale: 0.98 }}
            className="relative border rounded-xl shadow-md bg-gray-100 p-6 flex flex-col items-center text-center aspect-square transition-all"
          >
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
              className="text-5xl"
            >
              {card.emoji}
            </motion.span>
            <h3 className="mt-4 text-xl font-semibold">{card.title}</h3>
            <p className="mt-2 text-gray-600 text-sm">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;