function UseCasesSection() {
    const users = [
      {
        title: "Students & Learners",
        description:
          "Understand algorithmic trading concepts through hands-on experimentation."
      },
      {
        title: "Retail Traders",
        description:
          "Validate trading ideas and strategies before using real capital."
      },
      {
        title: "Engineers & Developers",
        description:
          "Explore quantitative finance by connecting theory with real market data."
      }
    ];
  
    return (
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Who is TradeLab for?
          </h2>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {users.map((user, index) => (
              <div
                key={index}
                className="bg-white border rounded-lg p-6 text-center"
              >
                <h3 className="text-xl font-semibold mb-3">
                  {user.title}
                </h3>
                <p className="text-gray-600">
                  {user.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  export default UseCasesSection;
  