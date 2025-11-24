'use client';

export default function Home() {
  const content = [
    {
      title: 'Bus Liveries ',
      description:
        "By Chalkyy. [CSG]",
      videoUrl: 'https://www.youtube.com/embed/SXmepkhoo-Q',
    },
    {
      title: 'Bus liveries, interiors and part reduction',
      description:
        "By Chalkyy. [CSG]",
      videoUrl: 'https://www.youtube.com/embed/a6NJCUew0dc',
    },
    {
      title: 'Bus Liveries',
      description:
        "By Chalkyy. [MESH]",
      videoUrl: 'https://www.youtube.com/embed/7ceKX62xWTo',
    },
  ];

  return (
    <main className="flex flex-col gap-16 items-center justify-center px-4 py-20 text-white max-w-7xl mx-auto">
      {content.map((item, idx) => (
        <div
          key={idx}
          className={`flex flex-col md:flex-row ${
            idx % 2 !== 0 ? 'md:flex-row-reverse' : ''
          } items-center gap-10 bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full`}
        >
          {/* Video */}
          <div className="w-full md:w-1/2">
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={item.videoUrl}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2 text-left space-y-4">
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <p className="text-white/80">{item.description}</p>
          </div>
        </div>
      ))}
    </main>
  );
}
