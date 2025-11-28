import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { authApi } from 'src/api/auth';
import { useAuth } from 'src/contexts/auth-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { AvatarPicker } from 'src/components/avatar-picker';

// ----------------------------------------------------------------------

export function ProfileView() {
  const { t } = useTranslation();
  const { user: authUser, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    avatar: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  // 加载用户信息
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { user } = await authApi.getProfile();
        setFormData({
          nickname: user.nickname || '',
          avatar: user.avatar || '',
          password: '',
          confirmPassword: '',
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    setError('');

    // 验证密码
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError(t('profile.passwordTooShort'));
      return;
    }

    try {
      setSaving(true);
      await authApi.updateProfile({
        nickname: formData.nickname,
        avatar: formData.avatar || undefined,
        password: formData.password || undefined,
      });

      // 如果修改了密码，需要重新登录
      if (formData.password) {
        // 这里需要重新获取 token，但由于我们不知道原密码，所以提示用户重新登录
        alert(t('profile.passwordChangedPleaseLogin'));
        window.location.href = '/sign-in';
        return;
      }

      // 更新 auth context 中的用户信息
      await refreshProfile();

      // 清空密码字段
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof Error ? err.message : t('error.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  }, [formData, t, refreshProfile]);

  if (loading) {
    return (
      <DashboardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        {t('profile.title')}
      </Typography>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 头像选择 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t('avatar.avatar')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <AvatarPicker
                value={formData.avatar}
                onChange={(avatar) => setFormData({ ...formData, avatar })}
                size={120}
              />
            </Box>
          </Box>

          {/* 用户名（只读） */}
          <TextField
            label={t('user.username')}
            value={authUser?.username || ''}
            disabled
            fullWidth
            helperText={t('profile.usernameCannotBeChanged')}
          />

          {/* 昵称 */}
          <TextField
            label={t('user.nickname')}
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            fullWidth
          />

          {/* 密码 */}
          <TextField
            label={t('profile.newPassword')}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            fullWidth
            helperText={t('profile.passwordLeaveEmpty')}
          />

          {/* 确认密码 */}
          {formData.password && (
            <TextField
              label={t('profile.confirmPassword')}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              fullWidth
            />
          )}

          {/* 错误提示 */}
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          {/* 提交按钮 */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleSubmit} variant="contained" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </Box>
        </Box>
      </Card>
    </DashboardContent>
  );
}

