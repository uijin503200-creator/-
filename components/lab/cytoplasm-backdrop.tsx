"use client";

export function CytoplasmBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden cytoplasm-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#10241c_0%,#050807_58%,#030504_100%)]" />
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full blur-[1px]"
          style={{
            width: 6 + (index % 5) * 7,
            height: 6 + (index % 4) * 6,
            left: `${(index * 17) % 100}%`,
            top: `${(index * 23) % 100}%`,
            background:
              index % 3 === 0
                ? "rgba(61,255,194,0.35)"
                : index % 3 === 1
                  ? "rgba(255,106,213,0.28)"
                  : "rgba(91,157,255,0.3)",
            animation: `organelle-drift ${8 + (index % 6)}s ease-in-out ${index * 0.4}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
