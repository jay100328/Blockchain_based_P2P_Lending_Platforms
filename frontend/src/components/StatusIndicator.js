import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return {
          color: theme.palette.success.main,
          backgroundColor: theme.palette.success.light,
        };
      case 'pending':
        return {
          color: theme.palette.warning.main,
          backgroundColor: theme.palette.warning.light,
        };
      case 'completed':
        return {
          color: theme.palette.info.main,
          backgroundColor: theme.palette.info.light,
        };
      case 'defaulted':
        return {
          color: theme.palette.error.main,
          backgroundColor: theme.palette.error.light,
        };
      default:
        return {
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.grey[200],
        };
    }
  };

  return {
    ...getStatusColor(status),
    fontWeight: 500,
    '& .MuiChip-label': {
      textTransform: 'capitalize',
    },
  };
});

const StatusIndicator = ({ status, label }) => {
  return (
    <StyledChip
      label={label || status}
      status={status}
      size="small"
    />
  );
};

export default StatusIndicator; 