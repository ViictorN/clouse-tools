import type { MetadataRoute } from 'next';
import { TOOLS, CATEGORIES } from '@/lib/data';
import { LOCALES } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Root redirect entry
  entries.push({
    url: `${baseUrl}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Localized static pages for both en and pt-br
  for (const locale of LOCALES) {
    const isEn = locale === 'en';
    const altLocale = isEn ? 'pt-br' : 'en';

    // Home
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          'pt-BR': `${baseUrl}/pt-br`,
          'en-US': `${baseUrl}/en`,
        },
      },
    });

    // Tools directory
    entries.push({
      url: `${baseUrl}/${locale}/tools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      alternates: {
        languages: {
          'pt-BR': `${baseUrl}/pt-br/tools`,
          'en-US': `${baseUrl}/en/tools`,
        },
      },
    });

    // Search
    entries.push({
      url: `${baseUrl}/${locale}/search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // About
    entries.push({
      url: `${baseUrl}/${locale}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });

    // Contact
    entries.push({
      url: `${baseUrl}/${locale}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });

    // Components
    entries.push({
      url: `${baseUrl}/${locale}/components`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });

    // Privacy
    entries.push({
      url: `${baseUrl}/${locale}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });

    // Terms
    entries.push({
      url: `${baseUrl}/${locale}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });

    // Categories
    for (const cat of CATEGORIES) {
      entries.push({
        url: `${baseUrl}/${locale}/category/${cat.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.85,
        alternates: {
          languages: {
            'pt-BR': `${baseUrl}/pt-br/category/${cat.id}`,
            'en-US': `${baseUrl}/en/category/${cat.id}`,
          },
        },
      });
    }

    // All 67 Tools
    for (const tool of TOOLS) {
      entries.push({
        url: `${baseUrl}/${locale}/tool/${tool.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: tool.popular ? 0.9 : 0.8,
        alternates: {
          languages: {
            'pt-BR': `${baseUrl}/pt-br/tool/${tool.slug}`,
            'en-US': `${baseUrl}/en/tool/${tool.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
