import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';

interface HomeHeaderProps {
  donorName: string;
  userImage?: ImageSourcePropType | null;
}

export const HomeHeader = ({ donorName, userImage }: HomeHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.topBackground}>
        <Text style={styles.welcomeText}>{`Bem vind@,\n${donorName}`}</Text>
      </View>

      <View style={styles.imageWrapper}>
        {userImage ? (
          <Image source={userImage} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="account"
              size={60}
              color={colors.primary}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
  },
  topBackground: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingLeft: 160,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: 140,
    justifyContent: 'center',
  },
  welcomeText: {
    color: colors.textLight,
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  imageWrapper: {
    position: 'absolute',
    left: 20,
    top: 40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.background,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
