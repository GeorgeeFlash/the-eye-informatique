import { defineType, defineField } from "sanity"

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
    }),
    defineField({
      name: "bannerImage",
      title: "Banner Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "mission",
      title: "Mission",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "body", title: "Body", type: "blockContent" }),
        defineField({ name: "image", title: "Story Image", type: "image", options: { hotspot: true } }),
      ],
    }),
    defineField({
      name: "story",
      title: "Our Story",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "body", title: "Body", type: "blockContent" }),
        defineField({ name: "image", title: "Story Image", type: "image", options: { hotspot: true } }),
      ],
    }),
    defineField({
      name: "services",
      title: "Services",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
            defineField({ name: "icon", title: "Icon Name", type: "string", description: "Select one of: Monitor, Wrench, Cable, Settings, Truck, ShieldCheck, Smartphone." }),
            defineField({ name: "image", title: "Service Image", type: "image", options: { hotspot: true } }),
          ],
          preview: {
            select: { title: "title", subtitle: "description", media: "image" },
          },
        },
      ],
    }),
    defineField({
      name: "stats",
      title: "Statistics",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "value", title: "Value", type: "string", validation: (r) => r.required() }),
            defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
          ],
          preview: {
            select: { title: "value", subtitle: "label" },
          },
        },
      ],
    }),
    defineField({
      name: "team",
      title: "Team Members",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "role", title: "Role", type: "string" }),
            defineField({ name: "image", title: "Photo", type: "image", options: { hotspot: true } }),
          ],
          preview: {
            select: { title: "name", subtitle: "role", media: "image" },
          },
        },
      ],
    }),
    defineField({
      name: "branches",
      title: "Branches",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "name", title: "Branch Name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "city", title: "City", type: "string", validation: (r) => r.required() }),
            defineField({ name: "address", title: "Address", type: "string" }),
            defineField({ name: "phone", title: "Phone", type: "string" }),
            defineField({ name: "email", title: "Email", type: "string" }),
            defineField({ name: "isHQ", title: "Is Headquarters", type: "boolean", initialValue: false }),
          ],
          preview: {
            select: { title: "name", subtitle: "city", isHQ: "isHQ" },
            prepare: ({ title, subtitle, isHQ }) => ({
              title: isHQ ? `${title} (HQ)` : title,
              subtitle,
            }),
          },
        },
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
    prepare: () => ({ title: "About Page" }),
  },
})
