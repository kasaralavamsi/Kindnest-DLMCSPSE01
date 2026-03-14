import { Card, CardContent, Stack, Typography, Chip, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

function statusColor(status) {
  switch (status) {
    case "OPEN":
      return "info";
    case "ACCEPTED":
      return "primary";
    case "DONE":
      return "secondary";
    case "CLOSED":
      return "default";
    default:
      return "default";
  }
}

function statusLabel(status, mode) {
  if (status === "DONE" && mode === "requester") return "AWAITING CONFIRMATION";
  return status;
}

function categoryLabel(category) {
  const map = {
    grocery: "Grocery",
    pharmacy: "Pharmacy",
    companionship: "Companionship",
    transport: "Transport",
    household: "Household",
    other: "Other"
  };
  return map[category] || "Other";
}

export default function TaskCard({
  task,
  mode, // "requester" | "volunteer"
  onAccept,
  onReject,
  onDone,
  onClose
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        "&:hover": {
          transform: { md: "translateY(-1px)" },
          boxShadow: { md: "0 10px 24px rgba(2,6,23,0.06)" }
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={1.25}>
          {/* Title + chips */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 16.5, sm: 17.5 } }}>
              {task.title}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip size="small" label={categoryLabel(task.category)} />
              <Chip
                size="small"
                color={statusColor(task.status)}
                label={statusLabel(task.status, mode)}
                variant={task.status === "CLOSED" ? "outlined" : "filled"}
              />
            </Stack>
          </Stack>

          {/* Description */}
          {task.description ? (
            <Typography color="text.secondary" sx={{ fontSize: { xs: 13.5, sm: 14 } }}>
              {task.description}
            </Typography>
          ) : null}

          {/* Dates */}
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(task.createdAt).toLocaleString()}
            </Typography>

            {task.neededBy ? (
              <Typography variant="body2" color="text.secondary">
                Needed by: {new Date(task.neededBy).toLocaleString()}
              </Typography>
            ) : null}
          </Box>

          {/* Actions */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            {/* ✅ Details (always available) */}
            <Button
              component={RouterLink}
              to={`/app/tasks/${task._id}`}
              variant="outlined"
              size="medium"
              endIcon={<ChevronRightRoundedIcon />}
              sx={{
                width: { xs: "100%", sm: "auto" },
                fontWeight: 800
              }}
            >
              Details
            </Button>

            {/* Volunteer actions */}
            {mode === "volunteer" && task.status === "OPEN" ? (
              <Button
                variant="contained"
                onClick={() => onAccept?.(task)}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Accept
              </Button>
            ) : null}

            {mode === "volunteer" && task.status === "ACCEPTED" ? (
              <>
                <Button
                  variant="contained"
                  onClick={() => onDone?.(task)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Mark Done
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => onReject?.(task)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Reject
                </Button>
              </>
            ) : null}

            {/* Requester actions */}
            {mode === "requester" && task.status === "DONE" ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => onClose?.(task)}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Confirm + Close
              </Button>
            ) : null}

            {task.status === "CLOSED" ? (
              <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: "auto" } }}>
                Completed{task.rating ? ` • Rating: ${task.rating}/5` : ""}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}