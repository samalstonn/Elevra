module.exports = {
  siteUrl: "https://www.elevracommunity.com", 
  generateRobotsTxt: true, // also generates robots.txt
  sitemapSize: 7000,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", disallow: ["/admin"] }, // Disallow admin pages
      { userAgent: "*", allow: "/" }, // Allow all other pages
    ],
  },
};
