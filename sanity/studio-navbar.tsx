import type { NavbarProps } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import Image from "next/image";

export function StudioNavbar(props: NavbarProps) {
  return (
    <Box>
      <Flex
        align="center"
        gap={3}
        padding={3}
        style={{
          borderBottom: "1px solid var(--card-border-color)",
          backgroundColor: "var(--card-bg-color)",
        }}
      >
        <Flex
          as="a"
          href="/"
          align="center"
          gap={2}
          style={{
            color: "inherit",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          <Image
            src="/logo.svg"
            alt="The Eye Informatique"
            width={24}
            height={24}
            style={{ display: "block" }}
          />
          <Text size={1} weight="semibold">
            The Eye Informatique
          </Text>
        </Flex>

        <Button as="a" href="/admin" mode="ghost" text="Admin panel" />

        <Box flex={1} />
      </Flex>

      {props.renderDefault(props)}
    </Box>
  );
}
