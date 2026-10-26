import { useState } from "react"
import { Logo, Button, Badge, Icon, Card } from "./ui"
import { MilestonePayWorkspace } from "./Workspace"
import { sampleMilestones, money } from "./model"

export default function App() {
  const [home, setHome] = useState(false)
  const go = (page: string) => {
    setHome(page === "Home")
    window.scrollTo(0, 0)
  }
  const initial = sampleMilestones
  if (!home) return <MilestonePayWorkspace onHome={() => setHome(true)} />
  return (
    <div className="landing">
      <header className="landing-nav">
        <button onClick={() => go("Home")}>
          <Logo />
        </button>
        <nav>
          <a href="#features">Why MilestonePay</a>
          <a href="#how">How it works</a>
          <button onClick={() => go("Overview")}>
            Explore the demo <Icon name="arrow" size={16} />
          </button>
        </nav>
        <Button onClick={() => go("Overview")}>
          Start demo <Icon name="arrow" size={16} />
        </Button>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span className="live-dot" /> LESS FRICTION. MORE FORWARD.
          </div>
          <h1>
            Great work deserves
            <br />a clear path to <em>paid.</em>
          </h1>
          <p>
            From agreement to payment, with AI-powered confidence.
            <br />A calmer way for freelancers and clients to move work forward.
          </p>
          <div className="hero-actions">
            <Button onClick={() => go("Overview")}>
              Explore the interactive demo <Icon name="arrow" size={18} />
            </Button>
            <span>No signup. No real payments.</span>
          </div>
          <div className="hero-preview">
            <div className="preview-top">
              <Logo />
              <Badge>Sample workspace</Badge>
            </div>
            <div className="preview-body">
              <div>
                <div className="eyebrow">YOUR NEXT GREAT PROJECT</div>
                <h2>E-commerce Website Redesign</h2>
                <p>Northstar Studio · $1,500 project value</p>
                <div className="progress-track">
                  <span style={{ width: "40%" }} />
                </div>
                <span>One agreement. Three clear milestones.</span>
              </div>
              <div className="preview-steps">
                {initial.map((m, i) => (
                  <div key={m.name}>
                    <span className="step-dot complete">{i + 1}</span>
                    <strong>{m.name}</strong>
                    <span>{money(m.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="landing-section">
          <div className="eyebrow">BUILT FOR BETTER WORKING RELATIONSHIPS</div>
          <h2>Clarity at every milestone.</h2>
          <div className="feature-grid">
            {[
              [
                "spark",
                "Agreements, made actionable",
                "Turn a project brief into clear milestones and acceptance criteria with simulated AI assistance.",
              ],
              [
                "check",
                "Confidence on both sides",
                "Review evidence together. Keep human judgment at the heart of every approval.",
              ],
              [
                "invoice",
                "A smoother path to payment",
                "Connect approved milestones to clear invoices, without losing track of the details.",
              ],
            ].map(([icon, title, text]) => (
              <Card key={title}>
                <span className="icon-tile">
                  <Icon name={icon} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Card>
            ))}
          </div>
        </section>
        <section id="how" className="landing-section how">
          <div className="eyebrow">A SIMPLE WAY FORWARD</div>
          <h2>Agree. Deliver. Get paid.</h2>
          <div className="feature-grid">
            {["Set the scope", "Review the work", "Move to payment"].map(
              (t, i) => (
                <div key={t}>
                  <span className="how-number">0{i + 1}</span>
                  <h3>{t}</h3>
                  <p>
                    {
                      [
                        "Define the agreement and break work into meaningful milestones.",
                        "Share deliverables, explore AI findings, and approve together.",
                        "Create a milestone invoice and track simulated payment progress.",
                      ][i]
                    }
                  </p>
                </div>
              ),
            )}
          </div>
          <Button onClick={() => go("Overview")}>
            Start your demo <Icon name="arrow" size={16} />
          </Button>
        </section>
      </main>
      <footer>
        <Logo />
        <span>
          Original prototype · All AI and financial data are simulated.
        </span>
      </footer>
    </div>
  )
}
