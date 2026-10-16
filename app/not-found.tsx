import Link from "next/link";

export default function NotFound() {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>404</h1>
        <p className="pixel text-[10px]">ESTE CARTUCHO NO ESTÁ EN EL VAULT</p>
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="btn lg">
          VOLVER AL VAULT
        </Link>
      </div>
    </div>
  );
}
