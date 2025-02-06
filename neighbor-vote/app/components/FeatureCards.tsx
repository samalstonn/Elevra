import Image from 'next/image';

const FeatureCards = () => {
  const cards = [
    {
      title: 'Contribute Smarter',
      description:
        'Evaluate trusted suggestions and give to the causes that matter to you.',
      image: '/Illustration-of-light-bulb-icon-on-transparent-background-PNG.png',
      customStyles: 'row-span-2 col-span-1 h-[400px] w-full',
    },
    {
      title: 'Contribute Faster',
      description:
        "Search through nonprofits and projects near you tailored to your passions.",
      image: '/public/editor-image.png',
      customStyles: 'row-span-2 col-span-2 h-[400px] w-full',
    },
    {
      title: 'Spam Free Donations',
      description:
        'Control how organizations reach out to you after you donate, ensuring your inbox stays clutter-free.',
      image: '/empty-inbox.png',
      customStyles: 'row-span-1 col-span-1 h-[400px] w-full',
    },
    {
      title: 'Quantify Your Impact',
      description:
        'Get all your performance data in one place, helping you refine your contributions and maximize results.',
      image: '/path/to/insights-image.png',
      customStyles: 'row-span-1 col-span-1 h-[400px] w-full',
    },
  ];

  const highlightCards = [
    {
      title: '75+',
      description: 'Trusted and Verified Organizations',
      customStyles: 'h-[185px] w-full text-center flex items-center justify-center bg-gray-100',
    },
    {
      title: '10x',
      description: 'Increase in Cause Engagement',
      customStyles: 'h-[190px] w-full text-center flex items-center justify-center bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-3 grid-rows-[auto_auto_auto] gap-6 px-6 py-36">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`relative border rounded-xl shadow-md bg-gray-100 overflow-auto ${card.customStyles}`}
        >
          {card.image && (
            <Image
              src={card.image}
              alt={card.title}
              width={200}
              height={200}
              className="mb-4 object-cover mx-auto flex items-center justify-center"
            />
          )}
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
            <p className="text-gray-600 text-sm overflow-hidden text-ellipsis">{card.description}</p>
          </div>
        </div>
      ))}
      <div className="col-span-1 row-span-2 flex flex-col gap-6">
        {highlightCards.map((card, index) => (
          <div
            key={index}
            className={`relative border rounded-xl shadow-md ${card.customStyles}`}
          >
            <div className="p-4">
              <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
              <p className="text-gray-600 text-sm">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;
