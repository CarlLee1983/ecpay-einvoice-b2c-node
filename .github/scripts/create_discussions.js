#!/usr/bin/env node

/**
 * GitHub Discussions Setup Script
 * 
 * This script creates discussion categories and an initial welcome discussion
 * for the repository if they don't already exist.
 * 
 * Required environment variables:
 * - GITHUB_REPOSITORY: owner/repo format
 * - GITHUB_TOKEN: GitHub token with repo permissions
 * 
 * Optional environment variables:
 * - INPUT_CATEGORIES: comma-separated list of category names (default: Q&A,How-to,Show & Tell,Ideas,Announcements)
 * - INPUT_WELCOME_TITLE: title for the welcome discussion (default: "Welcome to Discussions — {repository-name}")
 * - INPUT_WELCOME_BODY: body content for the welcome discussion
 */

const https = require('https');

// Configuration from environment variables
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const INPUT_CATEGORIES = process.env.INPUT_CATEGORIES || 'Q&A,How-to,Show & Tell,Ideas,Announcements';

// Extract repository name for welcome message
const getRepoName = () => {
  if (GITHUB_REPOSITORY) {
    const parts = GITHUB_REPOSITORY.split('/');
    return parts[1] || parts[0] || 'this project';
  }
  return 'this project';
};

const INPUT_WELCOME_TITLE = process.env.INPUT_WELCOME_TITLE || `Welcome to Discussions — ${getRepoName()}`;
const INPUT_WELCOME_BODY = process.env.INPUT_WELCOME_BODY || `# Welcome! 👋

Thank you for joining our community discussions! This is a space where you can:

- **Ask questions** about using this SDK
- **Share** your projects and use cases
- **Propose** new ideas and features
- **Help** others in the community

## Getting Started

- 📖 Check out the README for documentation
- 🐛 Found a bug? Please open an issue
- 💡 Have a feature idea? Start a discussion in the **Ideas** category
- ❓ Need help? Post in **Q&A**

## Categories

- **Q&A**: Ask questions and get answers from the community
- **How-to**: Share and discover guides and tutorials
- **Show & Tell**: Showcase your projects using this SDK
- **Ideas**: Propose and discuss new features
- **Announcements**: Stay updated with important news (maintainers only)

Let's build something great together! 🚀`;

// Validate required environment variables
if (!GITHUB_REPOSITORY || !GITHUB_TOKEN) {
  console.error('Error: GITHUB_REPOSITORY and GITHUB_TOKEN environment variables are required');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');
if (!owner || !repo) {
  console.error('Error: GITHUB_REPOSITORY must be in format owner/repo');
  process.exit(1);
}

// Parse categories
const desiredCategories = INPUT_CATEGORIES.split(',').map(c => c.trim());
console.log(`Repository: ${owner}/${repo}`);
console.log(`Desired categories: ${desiredCategories.join(', ')}`);

// Map category names to their emoji and description
const categoryConfig = {
  'Q&A': { emoji: '❓', description: 'Ask the community for help' },
  'How-to': { emoji: '📚', description: 'Share and discover guides' },
  'Show & Tell': { emoji: '🎨', description: 'Showcase your projects' },
  'Ideas': { emoji: '💡', description: 'Propose new features and improvements' },
  'Announcements': { emoji: '📣', description: 'Updates from maintainers' }
};

/**
 * Make a GraphQL request to GitHub API
 */
function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    
    const options = {
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Discussions-Setup-Script',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.errors) {
            reject(new Error(`GraphQL Error: ${JSON.stringify(parsed.errors)}`));
          } else {
            resolve(parsed);
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Get repository ID and existing discussion categories
 */
async function getRepositoryInfo() {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
        discussionCategories(first: 20) {
          nodes {
            id
            name
            emoji
            description
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(query, { owner, repo });
  return result.data.repository;
}

/**
 * Create a discussion category
 */
async function createCategory(repositoryId, name) {
  const config = categoryConfig[name] || { emoji: '💬', description: `Discussions about ${name}` };
  
  const mutation = `
    mutation($repositoryId: ID!, $name: String!, $emoji: String!, $description: String!) {
      createDiscussionCategory(input: {
        repositoryId: $repositoryId
        name: $name
        emoji: $emoji
        description: $description
      }) {
        discussionCategory {
          id
          name
        }
      }
    }
  `;

  const result = await graphqlRequest(mutation, {
    repositoryId,
    name,
    emoji: config.emoji,
    description: config.description
  });

  return result.data.createDiscussionCategory.discussionCategory;
}

/**
 * Search for existing discussions by title
 * Note: Fetches first 100 discussions. For repos with many discussions,
 * this may not find older discussions. This is acceptable for checking
 * the existence of a welcome discussion which is typically created early.
 */
async function findDiscussionByTitle(title) {
  const query = `
    query($owner: String!, $repo: String!, $first: Int!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: $first) {
          nodes {
            id
            title
            url
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(query, { owner, repo, first: 100 });
  const discussions = result.data.repository.discussions.nodes;
  return discussions.find(d => d.title === title);
}

/**
 * Create a discussion
 */
async function createDiscussion(repositoryId, categoryId, title, body) {
  const mutation = `
    mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {
        repositoryId: $repositoryId
        categoryId: $categoryId
        title: $title
        body: $body
      }) {
        discussion {
          id
          title
          url
        }
      }
    }
  `;

  const result = await graphqlRequest(mutation, {
    repositoryId,
    categoryId,
    title,
    body
  });

  return result.data.createDiscussion.discussion;
}

/**
 * Pin a discussion
 */
async function pinDiscussion(discussionId) {
  const mutation = `
    mutation($discussionId: ID!) {
      pinDiscussion(input: {
        discussionId: $discussionId
      }) {
        discussion {
          id
          title
        }
      }
    }
  `;

  try {
    await graphqlRequest(mutation, { discussionId });
    console.log('Discussion pinned successfully');
  } catch (err) {
    console.warn('Warning: Could not pin discussion:', err.message);
    console.warn('This may require additional permissions. The discussion was created but not pinned.');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('\n=== Fetching repository information ===');
    const repoInfo = await getRepositoryInfo();
    const repositoryId = repoInfo.id;
    const existingCategories = repoInfo.discussionCategories.nodes;
    
    console.log(`Repository ID: ${repositoryId}`);
    console.log(`Existing categories: ${existingCategories.map(c => c.name).join(', ') || 'none'}`);

    // Create missing categories
    console.log('\n=== Creating missing categories ===');
    const categoryMap = {};
    
    for (const categoryName of desiredCategories) {
      const existing = existingCategories.find(c => c.name === categoryName);
      if (existing) {
        console.log(`✓ Category "${categoryName}" already exists (ID: ${existing.id})`);
        categoryMap[categoryName] = existing.id;
      } else {
        console.log(`Creating category "${categoryName}"...`);
        try {
          const newCategory = await createCategory(repositoryId, categoryName);
          console.log(`✓ Created category "${categoryName}" (ID: ${newCategory.id})`);
          categoryMap[categoryName] = newCategory.id;
        } catch (err) {
          console.error(`✗ Failed to create category "${categoryName}":`, err.message);
        }
      }
    }

    // Create welcome discussion
    console.log('\n=== Creating welcome discussion ===');
    const existingDiscussion = await findDiscussionByTitle(INPUT_WELCOME_TITLE);
    
    if (existingDiscussion) {
      console.log(`✓ Welcome discussion already exists: ${existingDiscussion.url}`);
    } else {
      // Determine which category to use: prefer Announcements, fallback to Q&A
      const preferredCategoryName = categoryMap['Announcements'] ? 'Announcements' : 'Q&A';
      const categoryId = categoryMap[preferredCategoryName];
      
      if (!categoryId) {
        console.error('✗ No suitable category found for welcome discussion');
        console.error('Available categories:', Object.keys(categoryMap));
        process.exit(1);
      }

      console.log(`Creating welcome discussion in "${preferredCategoryName}" category...`);
      const discussion = await createDiscussion(
        repositoryId,
        categoryId,
        INPUT_WELCOME_TITLE,
        INPUT_WELCOME_BODY
      );
      
      console.log(`✓ Created welcome discussion: ${discussion.url}`);
      
      // Try to pin the discussion
      console.log('Attempting to pin welcome discussion...');
      await pinDiscussion(discussion.id);
    }

    console.log('\n=== Summary ===');
    console.log('✓ Discussions setup completed successfully');
    console.log(`Categories: ${Object.keys(categoryMap).join(', ')}`);
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
