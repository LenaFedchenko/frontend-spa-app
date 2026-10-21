
import { CommentsFeed } from '../../widgets/comments-feed/CommentsFeed';
import { Header } from '../../widgets/header/Header';
import { Icon } from '../../shared/ui/Icon';
import styles from './CommentsPage.module.css';

export function CommentsPage() {
  return (
    <>
      <a className="skip-link" href="#discussions">
        Skip to discussions
      </a>

      <Header />

      <main className={styles.main}>
        <div className={styles.intro}>
          <div className={styles.eyebrow}>
            THE COMMUNITY BOARD
          </div>

          <h1>
            A little conversation.
            <br className={styles.mobileBreak} />
            {' '}A lot of perspective.
          </h1>

          <p>
            Share what’s on your mind. Learn something new. Find common ground.
          </p>

          <a className="primary" href="#join">
            <span aria-hidden="true">+</span>
            Start a discussion
          </a>
        </div>

        <div className={styles.layout}>
          <div id="discussions" className={styles.feed}>
            <CommentsFeed />
          </div>

          <aside className={styles.sidebar} id="community">
            <section className={styles.about}>
              <span className={styles.sideIcon}>
                <Icon name="chat" size={22} />
              </span>

              <h2>
                Different voices.
                <br />
                Shared space.
              </h2>

              <p>
                A simple space for thoughtful conversations, curious questions,
                and everything in between.
              </p>

              <div className={styles.rule} />

              <span className={styles.open}>
                <span />
                Open to everyone
              </span>

              <p className={styles.small}>
                Read, reply, or start something new.
                <br />
                No account required.
              </p>
            </section>

            <section className={styles.guidelines}>
              <h2>A good conversation starts with…</h2>

              <ol>
                <li>
                  <span>01</span>

                  <div>
                    <strong>A little kindness</strong>
                    <p>
                      Be respectful. There’s a person on the other side.
                    </p>
                  </div>
                </li>

                <li>
                  <span>02</span>

                  <div>
                    <strong>A fresh perspective</strong>
                    <p>
                      Share your experience. Stay curious about others.
                    </p>
                  </div>
                </li>

                <li>
                  <span>03</span>

                  <div>
                    <strong>Something that matters</strong>
                    <p>
                      Keep it relevant and give your words a little thought.
                    </p>
                  </div>
                </li>
              </ol>
            </section>

            <div className={styles.sideFooter}>
              Built for conversation.
              <br />
              Made better by you.
            </div>
          </aside>
        </div>

        <footer className={styles.footer}>
          <span>
            © {new Date().getFullYear()} Common Ground
          </span>

          <span>A space to listen. A place to connect.</span>

          <a href="#top">
            Back to top ↑
          </a>
        </footer>
      </main>
    </>
  );
}
