import { useEffect, useState } from "react";
import { NewPoll } from "./pages/NewPoll.js";
import { Poll } from "./pages/Poll.js";

function parseRoute(pathname: string): { name: "new" | "poll" | "home"; code?: string } {
  if (pathname === "/" || pathname === "") return { name: "home" };
  if (pathname === "/new") return { name: "new" };
  const m = pathname.match(/^\/p\/([^/]+)$/);
  if (m) return { name: "poll", code: m[1] };
  return { name: "home" };
}

export function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setRoute(parseRoute(path));
  };

  return (
    <div className="container">
      <header>
        <h1>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            投票系统
          </a>
        </h1>
      </header>
      <main>
        {route.name === "home" && (
          <div className="home">
            <p>轻量群体投票工具。从模板快速开始，或自定义创建。</p>
            <div className="template-grid">
              <a
                href="/new?template=travel"
                className="template-card"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/new?template=travel");
                }}
              >
                <strong>去哪旅游</strong>
                <small>周末目的地</small>
              </a>
              <a
                href="/new?template=lunch"
                className="template-card"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/new?template=lunch");
                }}
              >
                <strong>中饭吃什么</strong>
                <small>同事午餐</small>
              </a>
            </div>
            <p>
              <a
                href="/new"
                className="btn"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/new");
                }}
              >
                自定义创建
              </a>
            </p>
          </div>
        )}
        {route.name === "new" && <NewPoll navigate={navigate} />}
        {route.name === "poll" && route.code && <Poll shortCode={route.code} />}
      </main>
      <footer>
        <small>匿名投票，cookie 去重 — 并非强身份认证；删除 cookie 即可重投。</small>
      </footer>
    </div>
  );
}
