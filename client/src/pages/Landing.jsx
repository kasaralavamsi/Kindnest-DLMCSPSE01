import { Box, Typography, Button, Card, CardContent, Stack, Divider } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function Landing() {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,230,160,0.14) 100%)"
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 5 } }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {/* Header row */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: 2,
                fontWeight: 950,
                color: "primary.main",
                display: "inline-flex",
                alignItems: "center",
                gap: 1
              }}
            >
              KINDNEST
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "secondary.main"
                }}
              />
            </Typography>

            <Typography variant="body2" color="text.secondary">
              v0 (MVP)
            </Typography>
          </Box>

          <Divider />

          {/* Headline */}
          <Typography
            variant="h4"
            sx={{
              lineHeight: 1.08,
              fontSize: { xs: 28, sm: 34, md: 40 }
            }}
          >
            Community help,{" "}
            <Box component="span" sx={{ color: "secondary.main" }}>
              made simple
            </Box>
            .
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 640,
              fontSize: { xs: 14.5, sm: 15.5 }
            }}
          >
            Request small everyday support or volunteer to help nearby people—fast, safe, and
            trackable.
          </Typography>

          {/* CTAs (stack on mobile) */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Get started
            </Button>
            <Button
              component={RouterLink}
              to="/register?role=volunteer"
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
            >
              I want to volunteer
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Box
              component={RouterLink}
              to="/login"
              sx={{
                color: "primary.main",
                fontWeight: 800,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" }
              }}
            >
              Log in
            </Box>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}