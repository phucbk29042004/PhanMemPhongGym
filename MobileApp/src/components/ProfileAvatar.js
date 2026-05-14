import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { getInitials } from '../utils/data';

export default function ProfileAvatar({ uri, name, size = 48 }) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, avatarStyle]} />;
  }

  return (
    <View style={[styles.placeholder, avatarStyle]}>
      <Text style={[styles.initials, { fontSize: Math.max(13, size * 0.32) }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: '#1D9336',
    backgroundColor: '#e7f5e9',
  },
  placeholder: {
    borderWidth: 2,
    borderColor: '#1D9336',
    backgroundColor: '#e7f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#1D9336',
    fontWeight: '800',
  },
});
