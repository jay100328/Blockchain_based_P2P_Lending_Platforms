import { Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '12px',
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  color = 'primary',
  trend,
  trendLabel
}) => {
  const getTrendColor = (trend) => {
    if (!trend) return 'text.secondary';
    return trend > 0 ? 'success.main' : 'error.main';
  };

  return (
    <StyledCard>
      <CardContent>
        <IconWrapper>
          {icon}
        </IconWrapper>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend !== undefined && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="body2" 
              color={getTrendColor(trend)}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              {trendLabel && ` ${trendLabel}`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default StatsCard; 