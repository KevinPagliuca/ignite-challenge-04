import { GetStaticProps } from 'next';

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

import Header from '../components/Header';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from 'react-icons/fi';
import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    };
  });
  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage() {
    if (currentPage !== 1 && nextPage !== null) return;

    const postsResult = await fetch(`${nextPage}`).then(res => res.json());
    setNextPage(postsResult.next_page);
    setCurrentPage(postsResult.page);

    const newPosts = postsResult.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.footerPost}>
                <div>
                  <FiCalendar size={20} />
                  <span>{post.first_publication_date}</span>
                </div>
                <div>
                  <FiUser size={20} />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <button
            className={styles.loadingMoreBtn}
            type="button"
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
