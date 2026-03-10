import { defineType, defineField } from "sanity"

export const affiliateLanding = defineType({
  name: "affiliateLanding",
  title: "Affiliate Landing Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
    }),
    defineField({
      name: "heroDescription",
      title: "Hero Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "howItWorks",
      title: "How It Works",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "stepNumber", title: "Step Number", type: "number", validation: (r) => r.required() }),
            defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
            defineField({ name: "icon", title: "Icon Name", type: "string", description: "Lucide icon name (e.g. UserPlus, Link, Banknote)" }),
          ],
          preview: {
            select: { title: "title", stepNumber: "stepNumber" },
            prepare: ({ title, stepNumber }) => ({
              title: `Step ${stepNumber}: ${title}`,
            }),
          },
        },
      ],
    }),
    defineField({
      name: "benefits",
      title: "Benefits",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
            defineField({ name: "icon", title: "Icon Name", type: "string" }),
          ],
          preview: {
            select: { title: "title", subtitle: "description" },
          },
        },
      ],
    }),
    defineField({
      name: "commissionNote",
      title: "Commission Note",
      type: "string",
      description: "Short note about commission rates (e.g. 'Rates vary by product')",
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "question", title: "Question", type: "string", validation: (r) => r.required() }),
            defineField({ name: "answer", title: "Answer", type: "blockContent" }),
          ],
          preview: {
            select: { title: "question" },
          },
        },
      ],
    }),
    defineField({
      name: "cta",
      title: "Call to Action",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
        defineField({ name: "buttonLabel", title: "Button Label", type: "string" }),
        defineField({ name: "buttonHref", title: "Button Link", type: "string" }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({ name: "metaTitle", title: "Meta Title", type: "string" }),
        defineField({ name: "metaDescription", title: "Meta Description", type: "text", rows: 3 }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Affiliate Landing Page" }),
  },
})
