function TechStackSection() {
    const stack = {
      frontend: ["React", "Vite", "Tailwind CSS"],
      backend: ["Python", "FastAPI", "Pandas", "NumPy"],
      data: ["Yahoo Finance API"]
    };
  
    return (
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tech Stack
          </h2>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Frontend</h3>
              <ul className="text-gray-600 space-y-2">
                {stack.frontend.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
  
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Backend</h3>
              <ul className="text-gray-600 space-y-2">
                {stack.backend.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
  
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Market Data</h3>
              <ul className="text-gray-600 space-y-2">
                {stack.data.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  export default TechStackSection;
  