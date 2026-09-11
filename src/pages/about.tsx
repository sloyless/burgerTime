import type { NextPage } from 'next';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram,
  faGithub,
  faLinkedin,
} from '@fortawesome/free-brands-svg-icons';
import { Layout } from 'layout';
import PageMeta from 'components/PageMeta';

const About: NextPage = () => {
  return (
    <Layout>
      <PageMeta
        title="About BurgerTime"
        description="What BurgerTime is, why it exists, and who is eating all those burgers."
      />
      <main className="mx-auto prose max-w-3xl py-8 prose-stone prose-headings:font-serif prose-headings:font-bold prose-a:text-brand-700 prose-a:no-underline hover:prose-a:text-brand-800">
        <h1>About BurgerTime</h1>
        <h2>What is this?</h2>
        <p>It allows me to rate and review all of the burgers I eat.</p>
        <h2>Why did you make this?</h2>
        <p>
          I eat a lot of burgers. It&apos;s my favorite food. This means I eat
          from lots of different places, and I don&apos;t remember all of them.
        </p>
        <p>
          I&apos;m also a programmer, so I can spin up a website really quick.
          Combine a love of tech, burgers, and data and you get BurgerTime.
        </p>
        <h2>Did you name it after that old arcade game?</h2>
        <Image
          src="/burgertimegame.png"
          alt="Burger Time Arcade Game"
          width={300}
          height={300}
          className="rounded-xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <p>Yep.</p>
        <h2>Who are you?</h2>
        <p>
          <a href="https://seanloyless.com" rel="nofollow" target="_blank">
            I&apos;m Sean.
          </a>{' '}
          I live in NYC and I make websites and apps.
        </p>
        <ul className="not-prose flex gap-4">
          <li>
            <a
              href="https://linkedin.com/in/seanloyless/"
              rel="nofollow"
              title="LinkedIn"
              className="text-brand-700 hover:text-brand-800"
              target="_blank"
            >
              <FontAwesomeIcon icon={faLinkedin} size="2xl" />
            </a>
          </li>
          <li>
            <a
              href="https://instagram.com/CrudeBaron"
              rel="nofollow"
              title="Instagram"
              className="text-brand-700 hover:text-brand-800"
              target="_blank"
            >
              <FontAwesomeIcon icon={faInstagram} size="2xl" />
            </a>
          </li>
          <li>
            <a
              href="https://github.com/sloyless"
              rel="nofollow"
              title="GitHub"
              className="text-brand-700 hover:text-brand-800"
              target="_blank"
            >
              <FontAwesomeIcon icon={faGithub} size="2xl" />
            </a>
          </li>
        </ul>
      </main>
    </Layout>
  );
};

export default About;
