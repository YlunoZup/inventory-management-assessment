import { Box, Card, CardContent, Typography, useTheme, alpha, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  trendValue,
  sparklineData,
  loading = false,
  onClick,
}) {
  const theme = useTheme();

  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const bgColor = colorMap[color] || color;

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp sx={{ fontSize: 16 }} />;
    if (trend === 'down') return <TrendingDown sx={{ fontSize: 16 }} />;
    return <TrendingFlat sx={{ fontSize: 16 }} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return theme.palette.success.main;
    if (trend === 'down') return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="rounded" width={52} height={52} />
          </Box>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(bgColor, 0.2)}`,
          '& .stat-card-icon': {
            transform: 'scale(1.1)',
          },
          '& .stat-card-sparkline': {
            opacity: 1,
          },
        },
        '&:active': onClick ? {
          transform: 'translateY(-2px)',
        } : {},
      }}
    >
      {/* Background gradient accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: `radial-gradient(circle at top right, ${alpha(bgColor, 0.1)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            className="stat-card-icon"
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(bgColor, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
            }}
          >
            <Icon sx={{ fontSize: 28, color: bgColor }} />
          </Box>
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: getTrendColor(),
                bgcolor: alpha(getTrendColor(), 0.1),
                px: 1,
                py: 0.5,
                borderRadius: 1,
                animation: 'fadeIn 0.5s ease',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(-5px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              {getTrendIcon()}
              <Typography variant="caption" fontWeight={600}>
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            mb: 0.5,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            lineHeight: 1.2,
            wordBreak: 'break-word',
            animation: 'countUp 0.5s ease-out',
            '@keyframes countUp': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {value}
        </Typography>

        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}

        {/* Optional Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <Box
            className="stat-card-sparkline"
            sx={{
              mt: 2,
              height: 30,
              opacity: 0.7,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Sparklines data={sparklineData} height={30} margin={2}>
              <SparklinesLine
                style={{
                  stroke: bgColor,
                  strokeWidth: 2,
                  fill: 'none',
                }}
              />
              <SparklinesSpots
                size={2}
                style={{
                  fill: bgColor,
                }}
              />
            </Sparklines>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
